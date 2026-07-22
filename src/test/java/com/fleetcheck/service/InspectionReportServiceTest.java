package com.fleetcheck.service;

import com.fleetcheck.domain.*;
import com.fleetcheck.domain.enums.RepairType;
import com.fleetcheck.domain.enums.ReportStatus;
import com.fleetcheck.dto.InspectionReportDTO;
import com.fleetcheck.exception.InvalidRequestException;
import com.fleetcheck.exception.InvalidStatusTransitionException;
import com.fleetcheck.exception.ResourceNotFoundException;
import com.fleetcheck.repository.DriverRepository;
import com.fleetcheck.repository.InspectionReportRepository;
import com.fleetcheck.repository.RepairOrderRepository;
import com.fleetcheck.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InspectionReportServiceTest {

    @Mock private InspectionReportRepository reportRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private RepairOrderRepository repairOrderRepository;

    private InspectionReportService service;

    private Vehicle vehicle;
    private Driver driver;

    @BeforeEach
    void setUp() {
        service = new InspectionReportService(reportRepository, vehicleRepository, driverRepository, repairOrderRepository);
        vehicle = Vehicle.builder().id(1L).unitNumber("FRK-1201").active(true).build();
        driver = Driver.builder().id(1L).firstName("Test").lastName("Driver").employeeId("E00001").active(true).build();
    }

    private InspectionReportDTO dto(boolean requiresRepair, RepairType repairType, String repairDescription) {
        return new InspectionReportDTO(null, 1L, 1L, LocalDate.of(2026, 7, 19), 100L,
                !requiresRepair, requiresRepair, repairType, repairDescription, null, null, null);
    }

    @Test
    void create_setsStatusSatisfactory_whenRequiresRepairFalse() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(driverRepository.findById(1L)).thenReturn(Optional.of(driver));
        when(reportRepository.save(any(InspectionReport.class))).thenAnswer(inv -> inv.getArgument(0));

        InspectionReportDTO result = service.create(dto(false, null, null));

        assertThat(result.status()).isEqualTo(ReportStatus.SATISFACTORY);
        assertThat(result.repairType()).isNull();
    }

    @Test
    void create_setsStatusRepairRequested_whenRequiresRepairTrueWithRepairTypeAndDescription() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(driverRepository.findById(1L)).thenReturn(Optional.of(driver));
        when(reportRepository.save(any(InspectionReport.class))).thenAnswer(inv -> inv.getArgument(0));

        InspectionReportDTO result = service.create(dto(true, RepairType.SAFETY, "Grinding noise from front brakes"));

        assertThat(result.status()).isEqualTo(ReportStatus.REPAIR_REQUESTED);
        assertThat(result.repairType()).isEqualTo(RepairType.SAFETY);
        assertThat(result.repairDescription()).isEqualTo("Grinding noise from front brakes");
    }

    @Test
    void create_throwsInvalidRequestException_whenRequiresRepairTrueWithoutRepairType() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(driverRepository.findById(1L)).thenReturn(Optional.of(driver));

        assertThrows(InvalidRequestException.class, () -> service.create(dto(true, null, null)));
    }

    @Test
    void create_throwsInvalidRequestException_whenRequiresRepairTrueWithoutDescription() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(driverRepository.findById(1L)).thenReturn(Optional.of(driver));

        assertThrows(InvalidRequestException.class, () -> service.create(dto(true, RepairType.SAFETY, null)));
    }

    @Test
    void create_throwsResourceNotFoundException_whenVehicleMissing() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(dto(false, null, null)));
    }

    @Test
    void completeRepair_throwsInvalidStatusTransition_whenStatusNotRepairRequested() {
        InspectionReport report = InspectionReport.builder()
                .id(1L).vehicle(vehicle).driver(driver).status(ReportStatus.SATISFACTORY).build();
        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));

        assertThrows(InvalidStatusTransitionException.class, () -> service.completeRepair(1L));
    }

    @Test
    void completeRepair_throwsInvalidRequestException_whenNoRepairOrder() {
        InspectionReport report = InspectionReport.builder()
                .id(1L).vehicle(vehicle).driver(driver).status(ReportStatus.REPAIR_REQUESTED).build();
        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));

        assertThrows(InvalidRequestException.class, () -> service.completeRepair(1L));
    }

    @Test
    void completeRepair_throwsInvalidRequestException_whenWorkDescriptionBlank() {
        InspectionReport report = InspectionReport.builder()
                .id(1L).vehicle(vehicle).driver(driver).status(ReportStatus.REPAIR_REQUESTED).build();
        RepairOrder order = RepairOrder.builder().id(1L).inspectionReport(report).workPerformedDescription("  ").build();
        report.setRepairOrder(order);
        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));

        assertThrows(InvalidRequestException.class, () -> service.completeRepair(1L));
    }

    @Test
    void completeRepair_setsStatusRepairCompleted_happyPath() {
        InspectionReport report = InspectionReport.builder()
                .id(1L).vehicle(vehicle).driver(driver).status(ReportStatus.REPAIR_REQUESTED).build();
        RepairOrder order = RepairOrder.builder()
                .id(1L).inspectionReport(report).workPerformedDescription("Replaced brakes").build();
        report.setRepairOrder(order);

        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));
        when(repairOrderRepository.save(any(RepairOrder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reportRepository.save(any(InspectionReport.class))).thenAnswer(inv -> inv.getArgument(0));

        InspectionReportDTO result = service.completeRepair(1L);

        assertThat(result.status()).isEqualTo(ReportStatus.REPAIR_COMPLETED);
        assertThat(order.getCompletedAt()).isNotNull();
    }

    @Test
    void reviewAndClose_throwsInvalidStatusTransition_whenStatusNotRepairCompleted() {
        InspectionReport report = InspectionReport.builder()
                .id(1L).vehicle(vehicle).driver(driver).status(ReportStatus.REPAIR_REQUESTED).build();
        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));

        assertThrows(InvalidStatusTransitionException.class, () -> service.reviewAndClose(1L));
    }

    @Test
    void reviewAndClose_setsStatusReviewedClosed_happyPath() {
        InspectionReport report = InspectionReport.builder()
                .id(1L).vehicle(vehicle).driver(driver).status(ReportStatus.REPAIR_COMPLETED).build();
        RepairOrder order = RepairOrder.builder()
                .id(1L).inspectionReport(report).workPerformedDescription("Replaced brakes")
                .completedAt(LocalDateTime.now()).build();
        report.setRepairOrder(order);

        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));
        when(repairOrderRepository.save(any(RepairOrder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reportRepository.save(any(InspectionReport.class))).thenAnswer(inv -> inv.getArgument(0));

        InspectionReportDTO result = service.reviewAndClose(1L);

        assertThat(result.status()).isEqualTo(ReportStatus.REVIEWED_CLOSED);
        assertThat(order.getDriverReviewedAt()).isNotNull();
    }
}

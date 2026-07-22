package com.fleetcheck.service;

import com.fleetcheck.domain.InspectionReport;
import com.fleetcheck.domain.Vehicle;
import com.fleetcheck.domain.enums.RepairType;
import com.fleetcheck.domain.enums.ReportStatus;
import com.fleetcheck.dto.VehicleDispatchStatusDTO;
import com.fleetcheck.exception.ResourceNotFoundException;
import com.fleetcheck.repository.InspectionReportRepository;
import com.fleetcheck.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock private VehicleRepository vehicleRepository;
    @Mock private InspectionReportRepository inspectionReportRepository;

    private VehicleService service;
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        service = new VehicleService(vehicleRepository, inspectionReportRepository);
        vehicle = Vehicle.builder().id(1L).unitNumber("FRK-1201").active(true).build();
        // Deliberately NOT stubbing findById here — the "vehicle missing" test
        // never calls findById(1L), and a shared stub it never uses would trip
        // Mockito's strict UnnecessaryStubbingException.
    }

    @Test
    void getDispatchStatus_returnsNotDispatchable_whenOpenSafetyReportExists() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        InspectionReport openSafety = InspectionReport.builder()
                .id(5L).vehicle(vehicle).requiresRepair(true)
                .repairType(RepairType.SAFETY).status(ReportStatus.REPAIR_REQUESTED).build();
        when(inspectionReportRepository.findByVehicle_Id(1L)).thenReturn(List.of(openSafety));

        VehicleDispatchStatusDTO result = service.getDispatchStatus(1L);

        assertThat(result.dispatchable()).isFalse();
        assertThat(result.blockingReportIds()).containsExactly(5L);
    }

    @Test
    void getDispatchStatus_returnsDispatchable_whenSafetyReportReviewedClosed() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        InspectionReport closedSafety = InspectionReport.builder()
                .id(5L).vehicle(vehicle).requiresRepair(true)
                .repairType(RepairType.SAFETY).status(ReportStatus.REVIEWED_CLOSED).build();
        when(inspectionReportRepository.findByVehicle_Id(1L)).thenReturn(List.of(closedSafety));

        VehicleDispatchStatusDTO result = service.getDispatchStatus(1L);

        assertThat(result.dispatchable()).isTrue();
        assertThat(result.blockingReportIds()).isEmpty();
    }

    @Test
    void getDispatchStatus_returnsDispatchable_whenOnlyNonSafetyOpenReport() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        InspectionReport nonSafety = InspectionReport.builder()
                .id(5L).vehicle(vehicle).requiresRepair(true)
                .repairType(RepairType.NON_SAFETY).status(ReportStatus.REPAIR_REQUESTED).build();
        when(inspectionReportRepository.findByVehicle_Id(1L)).thenReturn(List.of(nonSafety));

        VehicleDispatchStatusDTO result = service.getDispatchStatus(1L);

        assertThat(result.dispatchable()).isTrue();
    }

    @Test
    void getDispatchStatus_throwsResourceNotFoundException_whenVehicleMissing() {
        when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getDispatchStatus(99L));
    }
}

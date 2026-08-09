package com.fleetcheck.service;

import com.fleetcheck.domain.Driver;
import com.fleetcheck.domain.InspectionReport;
import com.fleetcheck.domain.Vehicle;
import com.fleetcheck.domain.enums.ReportStatus;
import com.fleetcheck.dto.InspectionReportDTO;
import com.fleetcheck.dto.PageResponse;
import com.fleetcheck.repository.DriverRepository;
import com.fleetcheck.repository.InspectionReportRepository;
import com.fleetcheck.repository.RepairOrderRepository;
import com.fleetcheck.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InspectionReportPaginationTest {

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

    @Test
    void getPage_returnsCorrectMetadata() {
        InspectionReport r1 = InspectionReport.builder().id(1L).vehicle(vehicle).driver(driver).status(ReportStatus.SATISFACTORY).build();
        Page<InspectionReport> mockPage = new PageImpl<>(List.of(r1), Pageable.ofSize(20), 45);
        when(reportRepository.findAll(any(Pageable.class))).thenReturn(mockPage);

        PageResponse<InspectionReportDTO> result = service.getPage(0, 20);

        assertThat(result.content()).hasSize(1);
        assertThat(result.totalElements()).isEqualTo(45);
        assertThat(result.totalPages()).isEqualTo(3);
        assertThat(result.hasNext()).isTrue();
        assertThat(result.hasPrevious()).isFalse();
    }

    @Test
    void getQueue_returnsOnlyOpenAndCompletedRepairs() {
        InspectionReport requested = InspectionReport.builder().id(1L).vehicle(vehicle).driver(driver).status(ReportStatus.REPAIR_REQUESTED).build();
        InspectionReport completed = InspectionReport.builder().id(2L).vehicle(vehicle).driver(driver).status(ReportStatus.REPAIR_COMPLETED).build();
        when(reportRepository.findByStatusIn(List.of(ReportStatus.REPAIR_REQUESTED, ReportStatus.REPAIR_COMPLETED)))
                .thenReturn(List.of(requested, completed));

        List<InspectionReportDTO> result = service.getQueue();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(InspectionReportDTO::status)
                .containsExactly(ReportStatus.REPAIR_REQUESTED, ReportStatus.REPAIR_COMPLETED);
    }

    @Test
    void getByVehicle_returnsOnlyThatVehiclesReports() {
        InspectionReport report = InspectionReport.builder().id(1L).vehicle(vehicle).driver(driver).status(ReportStatus.SATISFACTORY).build();
        when(reportRepository.findByVehicle_Id(1L)).thenReturn(List.of(report));

        List<InspectionReportDTO> result = service.getByVehicle(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).vehicleId()).isEqualTo(1L);
    }
}

package com.fleetcheck.service;

import com.fleetcheck.domain.Driver;
import com.fleetcheck.domain.InspectionReport;
import com.fleetcheck.domain.RepairOrder;
import com.fleetcheck.domain.Vehicle;
import com.fleetcheck.domain.enums.RepairType;
import com.fleetcheck.domain.enums.ReportStatus;
import com.fleetcheck.dto.InspectionReportDTO;
import com.fleetcheck.dto.PageResponse;
import com.fleetcheck.exception.InvalidRequestException;
import com.fleetcheck.exception.InvalidStatusTransitionException;
import com.fleetcheck.exception.ResourceNotFoundException;
import com.fleetcheck.repository.DriverRepository;
import com.fleetcheck.repository.InspectionReportRepository;
import com.fleetcheck.repository.RepairOrderRepository;
import com.fleetcheck.repository.VehicleRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InspectionReportService {

    private final InspectionReportRepository reportRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final RepairOrderRepository repairOrderRepository;

    public InspectionReportService(InspectionReportRepository reportRepository,
                                    VehicleRepository vehicleRepository,
                                    DriverRepository driverRepository,
                                    RepairOrderRepository repairOrderRepository) {
        this.reportRepository = reportRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.repairOrderRepository = repairOrderRepository;
    }

    // Paginated: the one report list with genuinely unbounded growth
    // (every driver, every shift, indefinitely). Sorted newest-first to
    // match the ordering the frontend has always shown.
    public PageResponse<InspectionReportDTO> getPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("inspectionDate").descending());
        return PageResponse.from(
                reportRepository.findAll(pageable).map(InspectionReportDTO::fromEntity)
        );
    }

    // Unpaginated by design: "currently open repairs" is a naturally small,
    // operationally-bounded set, not historical data that grows forever.
    public List<InspectionReportDTO> getQueue() {
        return reportRepository
                .findByStatusIn(List.of(ReportStatus.REPAIR_REQUESTED, ReportStatus.REPAIR_COMPLETED))
                .stream()
                .map(InspectionReportDTO::fromEntity)
                .toList();
    }

    // Unpaginated by design: one vehicle's own history is naturally bounded
    // regardless of how large the overall reports table grows.
    public List<InspectionReportDTO> getByVehicle(Long vehicleId) {
        return reportRepository.findByVehicle_Id(vehicleId).stream()
                .map(InspectionReportDTO::fromEntity)
                .toList();
    }

    public InspectionReportDTO getById(Long id) {
        return InspectionReportDTO.fromEntity(findOr404(id));
    }

    public InspectionReportDTO create(InspectionReportDTO dto) {
        Vehicle vehicle = findVehicleOr404(dto.vehicleId());
        Driver driver = findDriverOr404(dto.driverId());

        ReportStatus initialStatus;
        RepairType repairType = dto.repairType();
        String repairDescription = dto.repairDescription();

        if (dto.requiresRepair()) {
            if (repairType == null) {
                throw new InvalidRequestException("repairType is required when requiresRepair is true.");
            }
            if (repairDescription == null || repairDescription.isBlank()) {
                throw new InvalidRequestException("repairDescription is required when requiresRepair is true.");
            }
            initialStatus = ReportStatus.REPAIR_REQUESTED;
        } else {
            repairType = null;
            repairDescription = null;
            initialStatus = ReportStatus.SATISFACTORY;
        }

        InspectionReport report = InspectionReport.builder()
                .vehicle(vehicle)
                .driver(driver)
                .inspectionDate(dto.inspectionDate())
                .odometerReading(dto.odometerReading())
                .conditionSatisfactory(dto.conditionSatisfactory())
                .requiresRepair(dto.requiresRepair())
                .repairType(repairType)
                .repairDescription(repairDescription)
                .status(initialStatus)
                .driverSignedAt(LocalDateTime.now())
                .build();

        return InspectionReportDTO.fromEntity(reportRepository.save(report));
    }

    public InspectionReportDTO update(Long id, InspectionReportDTO dto) {
        InspectionReport existing = findOr404(id);
        existing.setVehicle(findVehicleOr404(dto.vehicleId()));
        existing.setDriver(findDriverOr404(dto.driverId()));
        existing.setInspectionDate(dto.inspectionDate());
        existing.setOdometerReading(dto.odometerReading());
        existing.setConditionSatisfactory(dto.conditionSatisfactory());
        existing.setRequiresRepair(dto.requiresRepair());
        existing.setRepairType(dto.repairType());
        existing.setRepairDescription(dto.repairDescription());
        return InspectionReportDTO.fromEntity(reportRepository.save(existing));
    }

    public InspectionReportDTO completeRepair(Long id) {
        InspectionReport report = findOr404(id);

        if (report.getStatus() != ReportStatus.REPAIR_REQUESTED) {
            throw new InvalidStatusTransitionException(report.getStatus(), ReportStatus.REPAIR_COMPLETED);
        }

        RepairOrder order = report.getRepairOrder();
        if (order == null) {
            throw new InvalidRequestException(
                    "Cannot complete repair: inspection report " + id + " has no repair order yet.");
        }
        if (order.getWorkPerformedDescription() == null || order.getWorkPerformedDescription().isBlank()) {
            throw new InvalidRequestException(
                    "Cannot complete repair: work performed description is required.");
        }
        if (order.getCompletedAt() == null) {
            order.setCompletedAt(LocalDateTime.now());
            repairOrderRepository.save(order);
        }

        report.setStatus(ReportStatus.REPAIR_COMPLETED);
        return InspectionReportDTO.fromEntity(reportRepository.save(report));
    }

    public InspectionReportDTO reviewAndClose(Long id) {
        InspectionReport report = findOr404(id);

        if (report.getStatus() != ReportStatus.REPAIR_COMPLETED) {
            throw new InvalidStatusTransitionException(report.getStatus(), ReportStatus.REVIEWED_CLOSED);
        }

        RepairOrder order = report.getRepairOrder();
        if (order == null) {
            throw new InvalidRequestException(
                    "Cannot review: inspection report " + id + " has no repair order.");
        }
        if (order.getDriverReviewedAt() == null) {
            order.setDriverReviewedAt(LocalDateTime.now());
            repairOrderRepository.save(order);
        }

        report.setStatus(ReportStatus.REVIEWED_CLOSED);
        return InspectionReportDTO.fromEntity(reportRepository.save(report));
    }

    public void delete(Long id) {
        reportRepository.delete(findOr404(id));
    }

    private InspectionReport findOr404(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection report", id));
    }

    private Vehicle findVehicleOr404(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
    }

    private Driver findDriverOr404(Long id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", id));
    }
}

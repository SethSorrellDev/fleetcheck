package com.fleetcheck.service;

import com.fleetcheck.domain.InspectionReport;
import com.fleetcheck.domain.RepairOrder;
import com.fleetcheck.dto.RepairOrderDTO;
import com.fleetcheck.exception.DuplicateResourceException;
import com.fleetcheck.exception.ResourceNotFoundException;
import com.fleetcheck.repository.InspectionReportRepository;
import com.fleetcheck.repository.RepairOrderRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RepairOrderService {

    private final RepairOrderRepository repairOrderRepository;
    private final InspectionReportRepository reportRepository;

    public RepairOrderService(RepairOrderRepository repairOrderRepository,
                               InspectionReportRepository reportRepository) {
        this.repairOrderRepository = repairOrderRepository;
        this.reportRepository = reportRepository;
    }

    public List<RepairOrderDTO> getAll() {
        return repairOrderRepository.findAll().stream().map(RepairOrderDTO::fromEntity).toList();
    }

    public RepairOrderDTO getById(Long id) {
        return RepairOrderDTO.fromEntity(findOr404(id));
    }

    public RepairOrderDTO create(RepairOrderDTO dto) {
        InspectionReport report = findReportOr404(dto.inspectionReportId());
        if (report.getRepairOrder() != null) {
            throw new DuplicateResourceException(
                    "Inspection report " + report.getId() + " already has a repair order.");
        }
        RepairOrder order = RepairOrder.builder()
                .inspectionReport(report)
                .workPerformedDescription(dto.workPerformedDescription())
                // Attestation, not freeform text — always the authenticated mechanic, never client-supplied.
                .completedByName(currentUsername())
                .completedAt(dto.completedAt())
                .driverReviewedAt(dto.driverReviewedAt())
                .build();
        return RepairOrderDTO.fromEntity(repairOrderRepository.save(order));
    }

    public RepairOrderDTO update(Long id, RepairOrderDTO dto) {
        RepairOrder existing = findOr404(id);
        existing.setWorkPerformedDescription(dto.workPerformedDescription());
        existing.setCompletedByName(currentUsername());
        existing.setCompletedAt(dto.completedAt());
        existing.setDriverReviewedAt(dto.driverReviewedAt());
        return RepairOrderDTO.fromEntity(repairOrderRepository.save(existing));
    }

    public void delete(Long id) {
        repairOrderRepository.delete(findOr404(id));
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private RepairOrder findOr404(Long id) {
        return repairOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Repair order", id));
    }

    private InspectionReport findReportOr404(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection report", id));
    }
}

package com.fleetcheck.service;

import com.fleetcheck.domain.DamageMarking;
import com.fleetcheck.domain.InspectionReport;
import com.fleetcheck.dto.DamageMarkingDTO;
import com.fleetcheck.exception.ResourceNotFoundException;
import com.fleetcheck.repository.DamageMarkingRepository;
import com.fleetcheck.repository.InspectionReportRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DamageMarkingService {

    private final DamageMarkingRepository markingRepository;
    private final InspectionReportRepository reportRepository;

    public DamageMarkingService(DamageMarkingRepository markingRepository,
                                 InspectionReportRepository reportRepository) {
        this.markingRepository = markingRepository;
        this.reportRepository = reportRepository;
    }

    public List<DamageMarkingDTO> getAll() {
        return markingRepository.findAll().stream().map(DamageMarkingDTO::fromEntity).toList();
    }

    public DamageMarkingDTO getById(Long id) {
        return DamageMarkingDTO.fromEntity(findOr404(id));
    }

    public DamageMarkingDTO create(DamageMarkingDTO dto) {
        InspectionReport report = findReportOr404(dto.inspectionReportId());
        DamageMarking marking = DamageMarking.builder()
                .inspectionReport(report)
                .damageType(dto.damageType())
                .viewAngle(dto.viewAngle())
                .xCoordinate(dto.xCoordinate())
                .yCoordinate(dto.yCoordinate())
                .notes(dto.notes())
                .build();
        return DamageMarkingDTO.fromEntity(markingRepository.save(marking));
    }

    public DamageMarkingDTO update(Long id, DamageMarkingDTO dto) {
        DamageMarking existing = findOr404(id);
        existing.setInspectionReport(findReportOr404(dto.inspectionReportId()));
        existing.setDamageType(dto.damageType());
        existing.setViewAngle(dto.viewAngle());
        existing.setXCoordinate(dto.xCoordinate());
        existing.setYCoordinate(dto.yCoordinate());
        existing.setNotes(dto.notes());
        return DamageMarkingDTO.fromEntity(markingRepository.save(existing));
    }

    public void delete(Long id) {
        markingRepository.delete(findOr404(id));
    }

    private DamageMarking findOr404(Long id) {
        return markingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Damage marking", id));
    }

    private InspectionReport findReportOr404(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection report", id));
    }
}

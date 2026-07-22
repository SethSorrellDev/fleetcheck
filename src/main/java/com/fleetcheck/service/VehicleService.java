package com.fleetcheck.service;

import com.fleetcheck.domain.InspectionReport;
import com.fleetcheck.domain.Vehicle;
import com.fleetcheck.domain.enums.RepairType;
import com.fleetcheck.domain.enums.ReportStatus;
import com.fleetcheck.dto.VehicleDTO;
import com.fleetcheck.dto.VehicleDispatchStatusDTO;
import com.fleetcheck.exception.DuplicateResourceException;
import com.fleetcheck.exception.ResourceNotFoundException;
import com.fleetcheck.repository.InspectionReportRepository;
import com.fleetcheck.repository.VehicleRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final InspectionReportRepository inspectionReportRepository;

    public VehicleService(VehicleRepository vehicleRepository,
                           InspectionReportRepository inspectionReportRepository) {
        this.vehicleRepository = vehicleRepository;
        this.inspectionReportRepository = inspectionReportRepository;
    }

    public List<VehicleDTO> getAll() {
        return vehicleRepository.findAll().stream().map(VehicleDTO::fromEntity).toList();
    }

    public VehicleDTO getById(Long id) {
        return VehicleDTO.fromEntity(findOr404(id));
    }

    public VehicleDTO create(VehicleDTO dto) {
        try {
            return VehicleDTO.fromEntity(vehicleRepository.save(dto.toEntity()));
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateResourceException(
                    "A vehicle with unit number '" + dto.unitNumber() + "' already exists.");
        }
    }

    public VehicleDTO update(Long id, VehicleDTO dto) {
        Vehicle existing = findOr404(id);
        existing.setUnitNumber(dto.unitNumber());
        existing.setVehicleType(dto.vehicleType());
        existing.setMake(dto.make());
        existing.setModel(dto.model());
        existing.setYear(dto.year());
        existing.setLicensePlate(dto.licensePlate());
        existing.setAssignedRoute(dto.assignedRoute());
        existing.setCurrentOdometer(dto.currentOdometer());
        existing.setActive(dto.active());
        try {
            return VehicleDTO.fromEntity(vehicleRepository.save(existing));
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateResourceException(
                    "A vehicle with unit number '" + dto.unitNumber() + "' already exists.");
        }
    }

    public void delete(Long id) {
        vehicleRepository.delete(findOr404(id));
    }

    public VehicleDispatchStatusDTO getDispatchStatus(Long id) {
        Vehicle vehicle = findOr404(id);
        List<InspectionReport> reports = inspectionReportRepository.findByVehicle_Id(id);

        List<Long> blockingReportIds = reports.stream()
                .filter(r -> r.isRequiresRepair()
                        && (r.getRepairType() == RepairType.SAFETY || r.getRepairType() == RepairType.BOTH)
                        && r.getStatus() != ReportStatus.REVIEWED_CLOSED)
                .map(InspectionReport::getId)
                .toList();

        return new VehicleDispatchStatusDTO(
                vehicle.getId(), vehicle.getUnitNumber(), blockingReportIds.isEmpty(), blockingReportIds);
    }

    private Vehicle findOr404(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
    }
}

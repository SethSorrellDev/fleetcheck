package com.fleetcheck.service;

import com.fleetcheck.domain.Driver;
import com.fleetcheck.dto.DriverDTO;
import com.fleetcheck.exception.DuplicateResourceException;
import com.fleetcheck.exception.ResourceNotFoundException;
import com.fleetcheck.repository.DriverRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DriverService {

    private final DriverRepository driverRepository;

    public DriverService(DriverRepository driverRepository) {
        this.driverRepository = driverRepository;
    }

    public List<DriverDTO> getAll() {
        return driverRepository.findAll().stream().map(DriverDTO::fromEntity).toList();
    }

    public DriverDTO getById(Long id) {
        return DriverDTO.fromEntity(findOr404(id));
    }

    public DriverDTO create(DriverDTO dto) {
        try {
            return DriverDTO.fromEntity(driverRepository.save(dto.toEntity()));
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateResourceException(
                    "A driver with employee ID '" + dto.employeeId() + "' already exists.");
        }
    }

    public DriverDTO update(Long id, DriverDTO dto) {
        Driver existing = findOr404(id);
        existing.setFirstName(dto.firstName());
        existing.setLastName(dto.lastName());
        existing.setEmployeeId(dto.employeeId());
        existing.setActive(dto.active());
        try {
            return DriverDTO.fromEntity(driverRepository.save(existing));
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateResourceException(
                    "A driver with employee ID '" + dto.employeeId() + "' already exists.");
        }
    }

    public void delete(Long id) {
        driverRepository.delete(findOr404(id));
    }

    private Driver findOr404(Long id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", id));
    }
}

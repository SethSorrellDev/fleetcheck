package com.fleetcheck.controller;

import com.fleetcheck.dto.VehicleDTO;
import com.fleetcheck.dto.VehicleDispatchStatusDTO;
import com.fleetcheck.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public List<VehicleDTO> getAll() {
        return vehicleService.getAll();
    }

    @GetMapping("/{id}")
    public VehicleDTO getById(@PathVariable Long id) {
        return vehicleService.getById(id);
    }

    @GetMapping("/{id}/dispatch-status")
    public VehicleDispatchStatusDTO getDispatchStatus(@PathVariable Long id) {
        return vehicleService.getDispatchStatus(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VehicleDTO create(@Valid @RequestBody VehicleDTO dto) {
        return vehicleService.create(dto);
    }

    @PutMapping("/{id}")
    public VehicleDTO update(@PathVariable Long id, @Valid @RequestBody VehicleDTO dto) {
        return vehicleService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        vehicleService.delete(id);
    }
}

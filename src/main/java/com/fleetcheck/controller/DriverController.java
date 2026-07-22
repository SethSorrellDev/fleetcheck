package com.fleetcheck.controller;

import com.fleetcheck.dto.DriverDTO;
import com.fleetcheck.service.DriverService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    @GetMapping
    public List<DriverDTO> getAll() {
        return driverService.getAll();
    }

    @GetMapping("/{id}")
    public DriverDTO getById(@PathVariable Long id) {
        return driverService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DriverDTO create(@Valid @RequestBody DriverDTO dto) {
        return driverService.create(dto);
    }

    @PutMapping("/{id}")
    public DriverDTO update(@PathVariable Long id, @Valid @RequestBody DriverDTO dto) {
        return driverService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        driverService.delete(id);
    }
}

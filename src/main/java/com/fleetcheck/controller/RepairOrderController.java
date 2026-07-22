package com.fleetcheck.controller;

import com.fleetcheck.dto.RepairOrderDTO;
import com.fleetcheck.service.RepairOrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repair-orders")
public class RepairOrderController {

    private final RepairOrderService repairOrderService;

    public RepairOrderController(RepairOrderService repairOrderService) {
        this.repairOrderService = repairOrderService;
    }

    @GetMapping
    public List<RepairOrderDTO> getAll() {
        return repairOrderService.getAll();
    }

    @GetMapping("/{id}")
    public RepairOrderDTO getById(@PathVariable Long id) {
        return repairOrderService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RepairOrderDTO create(@Valid @RequestBody RepairOrderDTO dto) {
        return repairOrderService.create(dto);
    }

    @PutMapping("/{id}")
    public RepairOrderDTO update(@PathVariable Long id, @Valid @RequestBody RepairOrderDTO dto) {
        return repairOrderService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        repairOrderService.delete(id);
    }
}

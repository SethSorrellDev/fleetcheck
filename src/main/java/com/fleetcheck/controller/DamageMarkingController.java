package com.fleetcheck.controller;

import com.fleetcheck.dto.DamageMarkingDTO;
import com.fleetcheck.service.DamageMarkingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/damage-markings")
public class DamageMarkingController {

    private final DamageMarkingService markingService;

    public DamageMarkingController(DamageMarkingService markingService) {
        this.markingService = markingService;
    }

    @GetMapping
    public List<DamageMarkingDTO> getAll() {
        return markingService.getAll();
    }

    @GetMapping("/{id}")
    public DamageMarkingDTO getById(@PathVariable Long id) {
        return markingService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DamageMarkingDTO create(@Valid @RequestBody DamageMarkingDTO dto) {
        return markingService.create(dto);
    }

    @PutMapping("/{id}")
    public DamageMarkingDTO update(@PathVariable Long id, @Valid @RequestBody DamageMarkingDTO dto) {
        return markingService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        markingService.delete(id);
    }
}

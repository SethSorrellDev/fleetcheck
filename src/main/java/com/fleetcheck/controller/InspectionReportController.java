package com.fleetcheck.controller;

import com.fleetcheck.dto.InspectionReportDTO;
import com.fleetcheck.dto.PageResponse;
import com.fleetcheck.service.InspectionReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inspection-reports")
public class InspectionReportController {

    private final InspectionReportService reportService;

    public InspectionReportController(InspectionReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public PageResponse<InspectionReportDTO> getPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return reportService.getPage(page, size);
    }

    @GetMapping("/queue")
    public List<InspectionReportDTO> getQueue() {
        return reportService.getQueue();
    }

    @GetMapping("/by-vehicle/{vehicleId}")
    public List<InspectionReportDTO> getByVehicle(@PathVariable Long vehicleId) {
        return reportService.getByVehicle(vehicleId);
    }

    @GetMapping("/{id}")
    public InspectionReportDTO getById(@PathVariable Long id) {
        return reportService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InspectionReportDTO create(@Valid @RequestBody InspectionReportDTO dto) {
        return reportService.create(dto);
    }

    @PutMapping("/{id}")
    public InspectionReportDTO update(@PathVariable Long id, @Valid @RequestBody InspectionReportDTO dto) {
        return reportService.update(id, dto);
    }

    @PostMapping("/{id}/complete-repair")
    public InspectionReportDTO completeRepair(@PathVariable Long id) {
        return reportService.completeRepair(id);
    }

    @PostMapping("/{id}/review")
    public InspectionReportDTO reviewAndClose(@PathVariable Long id) {
        return reportService.reviewAndClose(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        reportService.delete(id);
    }
}

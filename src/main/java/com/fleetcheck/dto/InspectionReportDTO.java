package com.fleetcheck.dto;

import com.fleetcheck.domain.InspectionReport;
import com.fleetcheck.domain.enums.RepairType;
import com.fleetcheck.domain.enums.ReportStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record InspectionReportDTO(
        Long id,
        @NotNull Long vehicleId,
        @NotNull Long driverId,
        @NotNull LocalDate inspectionDate,
        Long odometerReading,
        boolean conditionSatisfactory,
        boolean requiresRepair,
        RepairType repairType,
        String repairDescription,
        ReportStatus status,
        LocalDateTime driverSignedAt,
        LocalDateTime createdAt
) {
    public static InspectionReportDTO fromEntity(InspectionReport report) {
        return new InspectionReportDTO(
                report.getId(),
                report.getVehicle().getId(),
                report.getDriver().getId(),
                report.getInspectionDate(),
                report.getOdometerReading(),
                report.isConditionSatisfactory(),
                report.isRequiresRepair(),
                report.getRepairType(),
                report.getRepairDescription(),
                report.getStatus(),
                report.getDriverSignedAt(),
                report.getCreatedAt()
        );
    }
}

package com.fleetcheck.dto;

import com.fleetcheck.domain.RepairOrder;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record RepairOrderDTO(
        Long id,
        @NotNull Long inspectionReportId,
        String workPerformedDescription,
        String completedByName,
        LocalDateTime completedAt,
        LocalDateTime driverReviewedAt
) {
    public static RepairOrderDTO fromEntity(RepairOrder order) {
        return new RepairOrderDTO(
                order.getId(),
                order.getInspectionReport().getId(),
                order.getWorkPerformedDescription(),
                order.getCompletedByName(),
                order.getCompletedAt(),
                order.getDriverReviewedAt()
        );
    }
}

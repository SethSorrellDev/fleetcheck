package com.fleetcheck.dto;

import com.fleetcheck.domain.DamageMarking;
import com.fleetcheck.domain.enums.DamageType;
import com.fleetcheck.domain.enums.ViewAngle;
import jakarta.validation.constraints.NotNull;

public record DamageMarkingDTO(
        Long id,
        @NotNull Long inspectionReportId,
        @NotNull DamageType damageType,
        @NotNull ViewAngle viewAngle,
        @NotNull Double xCoordinate,
        @NotNull Double yCoordinate,
        String notes
) {
    public static DamageMarkingDTO fromEntity(DamageMarking marking) {
        return new DamageMarkingDTO(
                marking.getId(),
                marking.getInspectionReport().getId(),
                marking.getDamageType(),
                marking.getViewAngle(),
                marking.getXCoordinate(),
                marking.getYCoordinate(),
                marking.getNotes()
        );
    }
}

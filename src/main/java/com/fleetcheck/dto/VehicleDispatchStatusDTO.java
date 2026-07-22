package com.fleetcheck.dto;

import java.util.List;

public record VehicleDispatchStatusDTO(
        Long vehicleId,
        String unitNumber,
        boolean dispatchable,
        List<Long> blockingReportIds
) {
}

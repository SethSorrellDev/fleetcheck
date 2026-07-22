package com.fleetcheck.dto;

import com.fleetcheck.domain.Vehicle;
import com.fleetcheck.domain.enums.VehicleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VehicleDTO(
        Long id,
        @NotBlank String unitNumber,
        @NotNull VehicleType vehicleType,
        String make,
        String model,
        Integer year,
        String licensePlate,
        String assignedRoute,
        Long currentOdometer,
        boolean active
) {
    public static VehicleDTO fromEntity(Vehicle vehicle) {
        return new VehicleDTO(
                vehicle.getId(),
                vehicle.getUnitNumber(),
                vehicle.getVehicleType(),
                vehicle.getMake(),
                vehicle.getModel(),
                vehicle.getYear(),
                vehicle.getLicensePlate(),
                vehicle.getAssignedRoute(),
                vehicle.getCurrentOdometer(),
                vehicle.isActive()
        );
    }

    public Vehicle toEntity() {
        return Vehicle.builder()
                .unitNumber(unitNumber)
                .vehicleType(vehicleType)
                .make(make)
                .model(model)
                .year(year)
                .licensePlate(licensePlate)
                .assignedRoute(assignedRoute)
                .currentOdometer(currentOdometer)
                .active(active)
                .build();
    }
}

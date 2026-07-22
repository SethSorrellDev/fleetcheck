package com.fleetcheck.dto;

import com.fleetcheck.domain.Driver;
import jakarta.validation.constraints.NotBlank;

public record DriverDTO(
        Long id,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String employeeId,
        boolean active
) {
    public static DriverDTO fromEntity(Driver driver) {
        return new DriverDTO(
                driver.getId(),
                driver.getFirstName(),
                driver.getLastName(),
                driver.getEmployeeId(),
                driver.isActive()
        );
    }

    public Driver toEntity() {
        return Driver.builder()
                .firstName(firstName)
                .lastName(lastName)
                .employeeId(employeeId)
                .active(active)
                .build();
    }
}

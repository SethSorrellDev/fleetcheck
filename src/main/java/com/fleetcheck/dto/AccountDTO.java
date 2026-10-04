package com.fleetcheck.dto;

import com.fleetcheck.domain.Account;
import com.fleetcheck.domain.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AccountDTO(
        Long id,
        @NotBlank String username,
        @NotBlank @Email String email,
        @NotNull Role role,
        Long driverId,
        boolean active
) {
    public static AccountDTO fromEntity(Account account) {
        return new AccountDTO(
                account.getId(),
                account.getUsername(),
                account.getEmail(),
                account.getRole(),
                account.getDriver() != null ? account.getDriver().getId() : null,
                account.isActive()
        );
    }
}

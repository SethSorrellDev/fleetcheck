package com.fleetcheck.dto;

import com.fleetcheck.domain.Account;
import com.fleetcheck.domain.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AccountDTO(
        Long id,
        @NotBlank String username,
        String password,
        @NotNull Role role,
        Long driverId,
        boolean active
) {
    // password is intentionally write-only — never populated on read, even as a hash.
    public static AccountDTO fromEntity(Account account) {
        return new AccountDTO(
                account.getId(),
                account.getUsername(),
                null,
                account.getRole(),
                account.getDriver() != null ? account.getDriver().getId() : null,
                account.isActive()
        );
    }
}

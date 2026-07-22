package com.fleetcheck.controller;

import com.fleetcheck.domain.Account;
import com.fleetcheck.domain.Driver;
import com.fleetcheck.dto.CurrentUserDTO;
import com.fleetcheck.repository.AccountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final AccountRepository accountRepository;

    public AuthController(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @GetMapping("/api/me")
    public CurrentUserDTO me(Authentication authentication) {
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.replace("ROLE_", ""))
                .orElse("UNKNOWN");

        Long driverId = accountRepository.findByUsername(authentication.getName())
                .map(Account::getDriver)
                .map(Driver::getId)
                .orElse(null);

        return new CurrentUserDTO(authentication.getName(), role, driverId);
    }
}

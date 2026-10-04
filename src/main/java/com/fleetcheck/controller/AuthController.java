package com.fleetcheck.controller;

import com.fleetcheck.domain.Account;
import com.fleetcheck.domain.Driver;
import com.fleetcheck.dto.CurrentUserDTO;
import com.fleetcheck.repository.AccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
public class AuthController {

    private final AccountRepository accountRepository;

    public AuthController(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @GetMapping("/api/me")
    public ResponseEntity<?> me(Authentication authentication) {
        Optional<String> role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()))
                .findFirst();

        // Signed in to identity-service but no active FleetCheck account for this email.
        if (role.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of(
                    "status", 403,
                    "error", "Forbidden",
                    "message", "This account isn't authorized to use FleetCheck."));
        }

        Long driverId = accountRepository.findByUsername(authentication.getName())
                .map(Account::getDriver)
                .map(Driver::getId)
                .orElse(null);

        return ResponseEntity.ok(new CurrentUserDTO(authentication.getName(), role.get(), driverId));
    }
}

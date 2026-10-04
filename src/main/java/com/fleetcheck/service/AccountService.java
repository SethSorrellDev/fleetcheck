package com.fleetcheck.service;

import com.fleetcheck.domain.Account;
import com.fleetcheck.domain.Driver;
import com.fleetcheck.dto.AccountDTO;
import com.fleetcheck.exception.DuplicateResourceException;
import com.fleetcheck.exception.ResourceNotFoundException;
import com.fleetcheck.repository.AccountRepository;
import com.fleetcheck.repository.DriverRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final DriverRepository driverRepository;

    public AccountService(AccountRepository accountRepository, DriverRepository driverRepository) {
        this.accountRepository = accountRepository;
        this.driverRepository = driverRepository;
    }

    public List<AccountDTO> getAll() {
        return accountRepository.findAll().stream().map(AccountDTO::fromEntity).toList();
    }

    public AccountDTO getById(Long id) {
        return AccountDTO.fromEntity(findOr404(id));
    }

    // Creates a role assignment. The person signs in through identity-service with this
    // email, and the first login links their identity to this account.
    public AccountDTO create(AccountDTO dto) {
        Driver driver = dto.driverId() != null ? findDriverOr404(dto.driverId()) : null;

        Account account = Account.builder()
                .username(dto.username())
                .email(normalize(dto.email()))
                .role(dto.role())
                .driver(driver)
                .active(dto.active())
                .build();
        try {
            return AccountDTO.fromEntity(accountRepository.save(account));
        } catch (DataIntegrityViolationException e) {
            throw duplicate(dto);
        }
    }

    public AccountDTO update(Long id, AccountDTO dto) {
        Account existing = findOr404(id);
        existing.setUsername(dto.username());
        existing.setEmail(normalize(dto.email()));
        existing.setRole(dto.role());
        existing.setActive(dto.active());
        existing.setDriver(dto.driverId() != null ? findDriverOr404(dto.driverId()) : null);
        try {
            return AccountDTO.fromEntity(accountRepository.save(existing));
        } catch (DataIntegrityViolationException e) {
            throw duplicate(dto);
        }
    }

    private static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private static DuplicateResourceException duplicate(AccountDTO dto) {
        return new DuplicateResourceException(
                "An account with username '" + dto.username() + "' or email '" + dto.email() + "' already exists.");
    }

    private Account findOr404(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", id));
    }

    private Driver findDriverOr404(Long id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", id));
    }
}

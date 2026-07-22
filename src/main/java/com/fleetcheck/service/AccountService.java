package com.fleetcheck.service;

import com.fleetcheck.domain.Account;
import com.fleetcheck.domain.Driver;
import com.fleetcheck.dto.AccountDTO;
import com.fleetcheck.exception.DuplicateResourceException;
import com.fleetcheck.exception.InvalidRequestException;
import com.fleetcheck.exception.ResourceNotFoundException;
import com.fleetcheck.repository.AccountRepository;
import com.fleetcheck.repository.DriverRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;

    public AccountService(AccountRepository accountRepository,
                           DriverRepository driverRepository,
                           PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.driverRepository = driverRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<AccountDTO> getAll() {
        return accountRepository.findAll().stream().map(AccountDTO::fromEntity).toList();
    }

    public AccountDTO getById(Long id) {
        return AccountDTO.fromEntity(findOr404(id));
    }

    public AccountDTO create(AccountDTO dto) {
        if (dto.password() == null || dto.password().isBlank()) {
            throw new InvalidRequestException("password is required when creating an account.");
        }
        Driver driver = dto.driverId() != null ? findDriverOr404(dto.driverId()) : null;

        Account account = Account.builder()
                .username(dto.username())
                .password(passwordEncoder.encode(dto.password()))
                .role(dto.role())
                .driver(driver)
                .active(dto.active())
                .build();
        try {
            return AccountDTO.fromEntity(accountRepository.save(account));
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateResourceException(
                    "An account with username '" + dto.username() + "' already exists.");
        }
    }

    public AccountDTO update(Long id, AccountDTO dto) {
        Account existing = findOr404(id);
        existing.setUsername(dto.username());
        existing.setRole(dto.role());
        existing.setActive(dto.active());
        existing.setDriver(dto.driverId() != null ? findDriverOr404(dto.driverId()) : null);
        if (dto.password() != null && !dto.password().isBlank()) {
            existing.setPassword(passwordEncoder.encode(dto.password()));
        }
        try {
            return AccountDTO.fromEntity(accountRepository.save(existing));
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateResourceException(
                    "An account with username '" + dto.username() + "' already exists.");
        }
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

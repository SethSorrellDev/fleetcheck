package com.fleetcheck.service;

import com.fleetcheck.domain.Account;
import com.fleetcheck.domain.Driver;
import com.fleetcheck.domain.enums.Role;
import com.fleetcheck.dto.AccountDTO;
import com.fleetcheck.exception.DuplicateResourceException;
import com.fleetcheck.exception.InvalidRequestException;
import com.fleetcheck.exception.ResourceNotFoundException;
import com.fleetcheck.repository.AccountRepository;
import com.fleetcheck.repository.DriverRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock private AccountRepository accountRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private AccountService service;

    @BeforeEach
    void setUp() {
        service = new AccountService(accountRepository, driverRepository, passwordEncoder);
    }

    private AccountDTO dto(String password, Role role, Long driverId) {
        return new AccountDTO(null, "newuser", password, role, driverId, true);
    }

    @Test
    void create_throwsInvalidRequestException_whenPasswordBlank() {
        assertThrows(InvalidRequestException.class, () -> service.create(dto("  ", Role.DRIVER, null)));
    }

    @Test
    void create_hashesPasswordAndSaves_happyPath() {
        when(passwordEncoder.encode("secret123")).thenReturn("HASHED");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        AccountDTO result = service.create(dto("secret123", Role.MECHANIC, null));

        assertThat(result.username()).isEqualTo("newuser");
        assertThat(result.role()).isEqualTo(Role.MECHANIC);
        assertThat(result.password()).isNull();
    }

    @Test
    void create_linksDriver_whenDriverIdProvided() {
        Driver driver = Driver.builder().id(5L).firstName("Test").lastName("Driver").employeeId("E1").active(true).build();
        when(driverRepository.findById(5L)).thenReturn(Optional.of(driver));
        when(passwordEncoder.encode("secret123")).thenReturn("HASHED");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        AccountDTO result = service.create(dto("secret123", Role.DRIVER, 5L));

        assertThat(result.driverId()).isEqualTo(5L);
    }

    @Test
    void create_throwsResourceNotFoundException_whenDriverIdMissing() {
        when(driverRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(dto("secret123", Role.DRIVER, 99L)));
    }

    @Test
    void create_throwsDuplicateResourceException_onUniqueConstraintViolation() {
        when(passwordEncoder.encode("secret123")).thenReturn("HASHED");
        when(accountRepository.save(any(Account.class))).thenThrow(new DataIntegrityViolationException("dup"));

        assertThrows(DuplicateResourceException.class, () -> service.create(dto("secret123", Role.MECHANIC, null)));
    }

    @Test
    void update_keepsExistingPassword_whenPasswordOmitted() {
        Account existing = Account.builder().id(1L).username("olduser").password("OLD_HASH").role(Role.DRIVER).active(true).build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        service.update(1L, dto(null, Role.MECHANIC, null));

        assertThat(existing.getPassword()).isEqualTo("OLD_HASH");
        assertThat(existing.getRole()).isEqualTo(Role.MECHANIC);
    }

    @Test
    void update_throwsResourceNotFoundException_whenAccountMissing() {
        when(accountRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.update(1L, dto(null, Role.MECHANIC, null)));
    }
}

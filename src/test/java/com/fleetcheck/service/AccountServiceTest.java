package com.fleetcheck.service;

import com.fleetcheck.domain.Account;
import com.fleetcheck.domain.Driver;
import com.fleetcheck.domain.enums.Role;
import com.fleetcheck.dto.AccountDTO;
import com.fleetcheck.exception.DuplicateResourceException;
import com.fleetcheck.exception.ResourceNotFoundException;
import com.fleetcheck.repository.AccountRepository;
import com.fleetcheck.repository.DriverRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock private AccountRepository accountRepository;
    @Mock private DriverRepository driverRepository;

    private AccountService service;

    @BeforeEach
    void setUp() {
        service = new AccountService(accountRepository, driverRepository);
    }

    private AccountDTO dto(String email, Role role, Long driverId) {
        return new AccountDTO(null, "newuser", email, role, driverId, true);
    }

    @Test
    void create_normalizesEmailAndSaves_happyPath() {
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        AccountDTO result = service.create(dto("  New.User@Example.COM ", Role.MECHANIC, null));

        assertThat(result.email()).isEqualTo("new.user@example.com");
        assertThat(result.role()).isEqualTo(Role.MECHANIC);
        assertThat(result.driverId()).isNull();
    }

    @Test
    void create_linksDriver_whenDriverIdGiven() {
        Driver driver = mock(Driver.class);
        when(driver.getId()).thenReturn(7L);
        when(driverRepository.findById(7L)).thenReturn(Optional.of(driver));
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        AccountDTO result = service.create(dto("driver@example.com", Role.DRIVER, 7L));

        assertThat(result.driverId()).isEqualTo(7L);
    }

    @Test
    void create_throwsResourceNotFound_whenDriverMissing() {
        when(driverRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(dto("driver@example.com", Role.DRIVER, 99L)))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(accountRepository, never()).save(any());
    }

    @Test
    void create_throwsDuplicate_onConstraintViolation() {
        when(accountRepository.save(any(Account.class))).thenThrow(new DataIntegrityViolationException("dup"));

        assertThatThrownBy(() -> service.create(dto("dup@example.com", Role.MECHANIC, null)))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void update_changesFields_andKeepsIdentityLink() {
        Account existing = Account.builder().id(1L).username("olduser").email("old@example.com")
                .identitySub("sub-1").role(Role.DRIVER).active(true).build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        service.update(1L, new AccountDTO(1L, "newname", "New@Example.com", Role.MECHANIC, null, false));

        assertThat(existing.getUsername()).isEqualTo("newname");
        assertThat(existing.getEmail()).isEqualTo("new@example.com");
        assertThat(existing.getRole()).isEqualTo(Role.MECHANIC);
        assertThat(existing.isActive()).isFalse();
        assertThat(existing.getIdentitySub()).isEqualTo("sub-1");
    }

    @Test
    void update_throwsResourceNotFound_whenAccountMissing() {
        when(accountRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(5L, dto("x@example.com", Role.DRIVER, null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}

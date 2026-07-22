package com.fleetcheck.controller;

import com.fleetcheck.dto.AccountDTO;
import com.fleetcheck.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public List<AccountDTO> getAll() {
        return accountService.getAll();
    }

    @GetMapping("/{id}")
    public AccountDTO getById(@PathVariable Long id) {
        return accountService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountDTO create(@Valid @RequestBody AccountDTO dto) {
        return accountService.create(dto);
    }

    @PutMapping("/{id}")
    public AccountDTO update(@PathVariable Long id, @Valid @RequestBody AccountDTO dto) {
        return accountService.update(id, dto);
    }
}

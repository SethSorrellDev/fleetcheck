package com.fleetcheck.seed;

import com.fleetcheck.domain.Account;
import com.fleetcheck.domain.enums.Role;
import com.fleetcheck.repository.AccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class ProdAdminSeeder implements CommandLineRunner {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public ProdAdminSeeder(AccountRepository accountRepository, PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (accountRepository.count() > 0) {
            return;
        }

        String username = System.getenv("ADMIN_BOOTSTRAP_USERNAME");
        String password = System.getenv("ADMIN_BOOTSTRAP_PASSWORD");

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "Production deployment has no accounts and ADMIN_BOOTSTRAP_USERNAME / " +
                    "ADMIN_BOOTSTRAP_PASSWORD are not set. Set both environment variables and redeploy.");
        }

        accountRepository.save(Account.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .role(Role.ADMIN)
                .active(true)
                .build());

        System.out.println(">>> Bootstrap admin account created: " + username);
        System.out.println(">>> Log in and use Accounts to create real driver/mechanic/manager logins.");
    }
}

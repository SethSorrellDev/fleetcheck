package com.fleetcheck.seed;

import com.fleetcheck.domain.Account;
import com.fleetcheck.domain.enums.Role;
import com.fleetcheck.repository.AccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@Profile("prod")
public class ProdAdminSeeder implements CommandLineRunner {

    private final AccountRepository accountRepository;

    public ProdAdminSeeder(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public void run(String... args) {
        String raw = System.getenv("ADMIN_BOOTSTRAP_EMAIL");
        boolean hasEmail = raw != null && !raw.isBlank();

        if (!hasEmail) {
            if (accountRepository.count() == 0) {
                throw new IllegalStateException(
                        "Production deployment has no accounts and ADMIN_BOOTSTRAP_EMAIL is not set. "
                        + "Set it to the identity-service email of the first admin and redeploy.");
            }
            return;
        }

        String email = raw.trim().toLowerCase(Locale.ROOT);
        if (accountRepository.findByEmail(email).isPresent()) {
            return;
        }

        String base = email.substring(0, email.indexOf('@') > 0 ? email.indexOf('@') : email.length());
        String username = base.length() > 40 ? base.substring(0, 40) : base;
        if (accountRepository.findByUsername(username).isPresent()) {
            username = username + "-admin";
        }

        accountRepository.save(Account.builder()
                .username(username)
                .email(email)
                .role(Role.ADMIN)
                .active(true)
                .build());

        System.out.println(">>> Bootstrap admin created for " + email + ". Sign in through identity-service to link it.");
    }
}

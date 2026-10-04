package com.fleetcheck.security;

import com.fleetcheck.domain.Account;
import com.fleetcheck.repository.AccountRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Turns a verified identity-service access token into a FleetCheck authentication.
 * Roles live in FleetCheck's accounts table, never in the token. A valid token with no
 * active matching account authenticates with NO authorities, so every protected route
 * rejects it with 403.
 */
@Component
public class AccountJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final AccountRepository accountRepository;

    public AccountJwtAuthenticationConverter(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        if (!"access".equals(jwt.getClaimAsString("type"))) {
            throw new InvalidBearerTokenException("Only access tokens are accepted.");
        }
        String sub = jwt.getSubject();
        Optional<Account> account = resolve(sub, jwt.getClaimAsString("email"));

        if (account.isEmpty() || !account.get().isActive()) {
            return new JwtAuthenticationToken(jwt, List.of(), sub);
        }
        Account a = account.get();
        return new JwtAuthenticationToken(
                jwt,
                List.of(new SimpleGrantedAuthority("ROLE_" + a.getRole().name())),
                a.getUsername());
    }

    private Optional<Account> resolve(String sub, String email) {
        Optional<Account> bySub = accountRepository.findByIdentitySub(sub);
        if (bySub.isPresent()) {
            return bySub;
        }
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        Optional<Account> byEmail = accountRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT));
        if (byEmail.isEmpty()) {
            return Optional.empty();
        }
        Account account = byEmail.get();
        if (account.getIdentitySub() != null) {
            // Already linked to a different identity. Never re-link.
            return Optional.empty();
        }
        account.setIdentitySub(sub);
        return Optional.of(accountRepository.save(account));
    }
}

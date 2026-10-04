package com.fleetcheck.domain;

import com.fleetcheck.domain.enums.Role;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accounts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_account_username", columnNames = "username"),
        @UniqueConstraint(name = "uk_account_email", columnNames = "email"),
        @UniqueConstraint(name = "uk_account_identity_sub", columnNames = "identity_sub")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Display name only. Authentication happens in identity-service.
    @Column(nullable = false, length = 50)
    private String username;

    // Stored lowercase. Nullable so rows created before SSO survive the schema update.
    @Column(length = 255)
    private String email;

    // The identity-service subject. Set on the first successful login by email.
    @Column(name = "identity_sub", length = 36)
    private String identitySub;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    // Nullable — typically only DRIVER-role accounts are linked to a roster Driver record.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", foreignKey = @ForeignKey(name = "fk_account_driver"))
    private Driver driver;

    @Builder.Default
    private boolean active = true;
}

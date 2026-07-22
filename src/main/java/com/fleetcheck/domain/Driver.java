package com.fleetcheck.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "drivers", uniqueConstraints = {
        @UniqueConstraint(name = "uk_driver_employee_id", columnNames = "employee_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(name = "employee_id", nullable = false, length = 20)
    private String employeeId;

    @Builder.Default
    private boolean active = true;
}

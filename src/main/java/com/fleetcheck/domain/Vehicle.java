package com.fleetcheck.domain;

import com.fleetcheck.domain.enums.VehicleType;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vehicles", uniqueConstraints = {
        @UniqueConstraint(name = "uk_vehicle_unit_number", columnNames = "unit_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "unit_number", nullable = false, length = 20)
    private String unitNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false, length = 20)
    private VehicleType vehicleType;

    @Column(length = 50)
    private String make;

    @Column(length = 50)
    private String model;

    @Column(name = "vehicle_year")
    private Integer year;

    @Column(name = "license_plate", length = 20)
    private String licensePlate;

    @Column(name = "assigned_route")
    private String assignedRoute;

    @Column(name = "current_odometer")
    private Long currentOdometer;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InspectionReport> inspectionReports = new ArrayList<>();
}

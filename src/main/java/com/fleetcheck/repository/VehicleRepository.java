package com.fleetcheck.repository;

import com.fleetcheck.domain.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByUnitNumber(String unitNumber);
}

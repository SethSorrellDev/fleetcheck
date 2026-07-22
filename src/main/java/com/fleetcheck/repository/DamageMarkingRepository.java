package com.fleetcheck.repository;

import com.fleetcheck.domain.DamageMarking;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DamageMarkingRepository extends JpaRepository<DamageMarking, Long> {
}

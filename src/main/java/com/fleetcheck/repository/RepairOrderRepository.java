package com.fleetcheck.repository;

import com.fleetcheck.domain.RepairOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepairOrderRepository extends JpaRepository<RepairOrder, Long> {
}

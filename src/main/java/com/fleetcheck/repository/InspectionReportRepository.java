package com.fleetcheck.repository;

import com.fleetcheck.domain.InspectionReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InspectionReportRepository extends JpaRepository<InspectionReport, Long> {
    List<InspectionReport> findByVehicle_Id(Long vehicleId);
}

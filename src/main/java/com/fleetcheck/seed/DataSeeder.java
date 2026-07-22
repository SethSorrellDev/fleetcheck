package com.fleetcheck.seed;

import com.fleetcheck.domain.*;
import com.fleetcheck.domain.enums.*;
import com.fleetcheck.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@ConditionalOnProperty(name = "app.seed-data", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final AccountRepository accountRepository;
    private final InspectionReportRepository reportRepository;
    private final RepairOrderRepository repairOrderRepository;
    private final DamageMarkingRepository damageMarkingRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(VehicleRepository vehicleRepository,
                       DriverRepository driverRepository,
                       AccountRepository accountRepository,
                       InspectionReportRepository reportRepository,
                       RepairOrderRepository repairOrderRepository,
                       DamageMarkingRepository damageMarkingRepository,
                       PasswordEncoder passwordEncoder) {
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.accountRepository = accountRepository;
        this.reportRepository = reportRepository;
        this.repairOrderRepository = repairOrderRepository;
        this.damageMarkingRepository = damageMarkingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (vehicleRepository.count() > 0) {
            return;
        }

        Vehicle v1 = vehicleRepository.save(Vehicle.builder()
                .unitNumber("FRK-1201").vehicleType(VehicleType.STEP_VAN)
                .make("Freightliner").model("MT45").year(2021)
                .licensePlate("IN-88213").assignedRoute("Frankfort Route 3")
                .currentOdometer(52250L).active(true).build());

        Vehicle v2 = vehicleRepository.save(Vehicle.builder()
                .unitNumber("FRK-1215").vehicleType(VehicleType.STEP_VAN)
                .make("Freightliner").model("MT45").year(2020)
                .licensePlate("IN-77104").assignedRoute("Frankfort Route 5")
                .currentOdometer(68900L).active(true).build());

        Vehicle v3 = vehicleRepository.save(Vehicle.builder()
                .unitNumber("FRK-1230").vehicleType(VehicleType.BOX_TRUCK)
                .make("International").model("MV").year(2022)
                .licensePlate("IN-91045").assignedRoute("Frankfort Route 1")
                .currentOdometer(31200L).active(true).build());

        Vehicle v4 = vehicleRepository.save(Vehicle.builder()
                .unitNumber("FRK-1245").vehicleType(VehicleType.STEP_VAN)
                .make("Freightliner").model("MT45").year(2019)
                .licensePlate("IN-65321").assignedRoute("Frankfort Route 2")
                .currentOdometer(89340L).active(true).build());

        Vehicle v5 = vehicleRepository.save(Vehicle.builder()
                .unitNumber("FRK-1260").vehicleType(VehicleType.BOX_TRUCK)
                .make("International").model("MV").year(2023)
                .licensePlate("IN-10023").assignedRoute("Frankfort Route 4")
                .currentOdometer(12500L).active(true).build());

        Driver d1 = driverRepository.save(Driver.builder()
                .firstName("Seth").lastName("D.").employeeId("E10234").active(true).build());

        Driver d2 = driverRepository.save(Driver.builder()
                .firstName("Marcus").lastName("Reyes").employeeId("E10456").active(true).build());

        driverRepository.save(Driver.builder()
                .firstName("Angela").lastName("Brooks").employeeId("E10789").active(true).build());

        driverRepository.save(Driver.builder()
                .firstName("Devon").lastName("Palmer").employeeId("E11002").active(true).build());

        accountRepository.save(Account.builder()
                .username("driver1").password(passwordEncoder.encode("password123"))
                .role(Role.DRIVER).driver(d1).active(true).build());

        accountRepository.save(Account.builder()
                .username("driver2").password(passwordEncoder.encode("password123"))
                .role(Role.DRIVER).driver(d2).active(true).build());

        accountRepository.save(Account.builder()
                .username("mechanic1").password(passwordEncoder.encode("password123"))
                .role(Role.MECHANIC).active(true).build());

        accountRepository.save(Account.builder()
                .username("manager1").password(passwordEncoder.encode("password123"))
                .role(Role.FLEET_MANAGER).active(true).build());

        accountRepository.save(Account.builder()
                .username("admin1").password(passwordEncoder.encode("password123"))
                .role(Role.ADMIN).active(true).build());

        reportRepository.save(InspectionReport.builder()
                .vehicle(v1).driver(d1).inspectionDate(LocalDate.of(2026, 7, 10))
                .odometerReading(52200L).conditionSatisfactory(true).requiresRepair(false)
                .status(ReportStatus.SATISFACTORY)
                .driverSignedAt(LocalDateTime.of(2026, 7, 10, 6, 45)).build());

        InspectionReport report2 = reportRepository.save(InspectionReport.builder()
                .vehicle(v2).driver(d2).inspectionDate(LocalDate.of(2026, 7, 12))
                .odometerReading(68870L).conditionSatisfactory(false).requiresRepair(true)
                .repairType(RepairType.NON_SAFETY)
                .repairDescription("Rear panel has a scratch that should be touched up before it rusts.")
                .status(ReportStatus.REPAIR_REQUESTED)
                .driverSignedAt(LocalDateTime.of(2026, 7, 12, 7, 5)).build());

        damageMarkingRepository.save(DamageMarking.builder()
                .inspectionReport(report2).damageType(DamageType.SCRATCH).viewAngle(ViewAngle.SIDE)
                .xCoordinate(300.0).yCoordinate(150.0)
                .notes("Scratch along rear panel, non-safety").build());

        InspectionReport report3 = reportRepository.save(InspectionReport.builder()
                .vehicle(v3).driver(d1).inspectionDate(LocalDate.of(2026, 7, 8))
                .odometerReading(31150L).conditionSatisfactory(false).requiresRepair(true)
                .repairType(RepairType.SAFETY)
                .repairDescription("Grinding noise from front brakes when stopping — needs inspection.")
                .status(ReportStatus.REPAIR_COMPLETED)
                .driverSignedAt(LocalDateTime.of(2026, 7, 8, 6, 30)).build());

        repairOrderRepository.save(RepairOrder.builder()
                .inspectionReport(report3)
                .workPerformedDescription("Replaced front brake pads and rotors")
                .completedByName("mechanic1")
                .completedAt(LocalDateTime.of(2026, 7, 9, 14, 0))
                .build());

        damageMarkingRepository.save(DamageMarking.builder()
                .inspectionReport(report3).damageType(DamageType.DENT).viewAngle(ViewAngle.FRONT)
                .xCoordinate(120.5).yCoordinate(80.0)
                .notes("Front bumper dent from dock collision").build());

        InspectionReport report4 = reportRepository.save(InspectionReport.builder()
                .vehicle(v4).driver(d2).inspectionDate(LocalDate.of(2026, 7, 5))
                .odometerReading(89300L).conditionSatisfactory(false).requiresRepair(true)
                .repairType(RepairType.SAFETY)
                .repairDescription("Steering feels loose, noticeable play in the wheel at highway speed.")
                .status(ReportStatus.REVIEWED_CLOSED)
                .driverSignedAt(LocalDateTime.of(2026, 7, 5, 6, 50)).build());

        repairOrderRepository.save(RepairOrder.builder()
                .inspectionReport(report4)
                .workPerformedDescription("Replaced worn steering linkage component")
                .completedByName("mechanic1")
                .completedAt(LocalDateTime.of(2026, 7, 6, 11, 0))
                .driverReviewedAt(LocalDateTime.of(2026, 7, 6, 15, 30))
                .build());

        damageMarkingRepository.save(DamageMarking.builder()
                .inspectionReport(report4).damageType(DamageType.CHIP).viewAngle(ViewAngle.SIDE)
                .xCoordinate(45.0).yCoordinate(200.0)
                .notes("Paint chip along driver-side panel").build());

        reportRepository.save(InspectionReport.builder()
                .vehicle(v5).driver(d1).inspectionDate(LocalDate.of(2026, 7, 15))
                .odometerReading(12480L).conditionSatisfactory(true).requiresRepair(false)
                .status(ReportStatus.SATISFACTORY)
                .driverSignedAt(LocalDateTime.of(2026, 7, 15, 6, 40)).build());

        System.out.println(">>> Seeded 5 vehicles, 4 drivers, 5 accounts, 5 inspection reports (all statuses), 3 damage markings");
        System.out.println(">>> Accounts: driver1/driver2/mechanic1/manager1/admin1 (password: password123)");
    }
}

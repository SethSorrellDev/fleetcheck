package com.fleetcheck.domain;

import com.fleetcheck.domain.enums.ReportStatus;
import com.fleetcheck.domain.enums.RepairType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inspection_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InspectionReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false, foreignKey = @ForeignKey(name = "fk_report_vehicle"))
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "driver_id", nullable = false, foreignKey = @ForeignKey(name = "fk_report_driver"))
    private Driver driver;

    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate;

    @Column(name = "odometer_reading")
    private Long odometerReading;

    @Column(name = "condition_satisfactory", nullable = false)
    private boolean conditionSatisfactory;

    @Builder.Default
    @Column(name = "requires_repair", nullable = false)
    private boolean requiresRepair = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "repair_type", length = 20)
    private RepairType repairType;

    @Column(name = "repair_description", columnDefinition = "TEXT")
    private String repairDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportStatus status;

    @Column(name = "driver_signed_at")
    private LocalDateTime driverSignedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "inspectionReport", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DamageMarking> damageMarkings = new ArrayList<>();

    @OneToOne(mappedBy = "inspectionReport", cascade = CascadeType.ALL, orphanRemoval = true)
    private RepairOrder repairOrder;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ReportStatus.SATISFACTORY;
        }
    }
}

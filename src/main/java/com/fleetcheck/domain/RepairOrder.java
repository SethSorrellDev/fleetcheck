package com.fleetcheck.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "repair_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepairOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspection_report_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_repair_report"))
    private InspectionReport inspectionReport;

    @Column(name = "work_performed", columnDefinition = "TEXT")
    private String workPerformedDescription;

    @Column(name = "completed_by_name", length = 100)
    private String completedByName;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "driver_reviewed_at")
    private LocalDateTime driverReviewedAt;
}

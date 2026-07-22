package com.fleetcheck.domain;

import com.fleetcheck.domain.enums.DamageType;
import com.fleetcheck.domain.enums.ViewAngle;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "damage_markings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DamageMarking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspection_report_id", nullable = false, foreignKey = @ForeignKey(name = "fk_marking_report"))
    private InspectionReport inspectionReport;

    @Enumerated(EnumType.STRING)
    @Column(name = "damage_type", nullable = false, length = 20)
    private DamageType damageType;

    @Enumerated(EnumType.STRING)
    @Column(name = "view_angle", nullable = false, length = 20)
    private ViewAngle viewAngle;

    @Column(name = "x_coordinate", nullable = false)
    private Double xCoordinate;

    @Column(name = "y_coordinate", nullable = false)
    private Double yCoordinate;

    @Column(length = 255)
    private String notes;
}

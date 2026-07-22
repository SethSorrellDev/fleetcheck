package com.fleetcheck.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class InspectionReportWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void fullDvirWorkflow_safetyDefect_blocksThenUnblocksDispatch() throws Exception {

        MvcResult vehicleResult = mockMvc.perform(post("/api/vehicles")
                        .with(user("manager1").roles("FLEET_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"unitNumber":"TEST-001","vehicleType":"STEP_VAN","make":"Freightliner","model":"MT45",
                                 "year":2021,"licensePlate":"IN-00001","currentOdometer":1000,"active":true}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        long vehicleId = objectMapper.readTree(vehicleResult.getResponse().getContentAsString()).get("id").asLong();

        MvcResult driverResult = mockMvc.perform(post("/api/drivers")
                        .with(user("manager1").roles("FLEET_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Test","lastName":"Driver","employeeId":"T0001","active":true}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        long driverId = objectMapper.readTree(driverResult.getResponse().getContentAsString()).get("id").asLong();

        MvcResult reportResult = mockMvc.perform(post("/api/inspection-reports")
                        .with(user("driver1").roles("DRIVER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"driverId":%d,"inspectionDate":"2026-07-19",
                                 "odometerReading":1010,"conditionSatisfactory":false,
                                 "requiresRepair":true,"repairType":"SAFETY",
                                 "repairDescription":"Grinding noise from front brakes when stopping"}
                                """.formatted(vehicleId, driverId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("REPAIR_REQUESTED"))
                .andExpect(jsonPath("$.driverSignedAt").exists())
                .andReturn();
        long reportId = objectMapper.readTree(reportResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/vehicles/" + vehicleId + "/dispatch-status")
                        .with(user("manager1").roles("FLEET_MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dispatchable").value(false))
                .andExpect(jsonPath("$.blockingReportIds[0]").value(reportId));

        mockMvc.perform(post("/api/inspection-reports/" + reportId + "/complete-repair")
                        .with(user("mechanic1").roles("MECHANIC")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/repair-orders")
                        .with(user("mechanic1").roles("MECHANIC"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"inspectionReportId":%d,"workPerformedDescription":"Replaced brake pads"}
                                """.formatted(reportId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.completedByName").value("mechanic1"));

        mockMvc.perform(post("/api/inspection-reports/" + reportId + "/complete-repair")
                        .with(user("mechanic1").roles("MECHANIC")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REPAIR_COMPLETED"));

        mockMvc.perform(get("/api/vehicles/" + vehicleId + "/dispatch-status")
                        .with(user("manager1").roles("FLEET_MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dispatchable").value(false));

        mockMvc.perform(post("/api/inspection-reports/" + reportId + "/review")
                        .with(user("driver1").roles("DRIVER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVIEWED_CLOSED"));

        mockMvc.perform(get("/api/vehicles/" + vehicleId + "/dispatch-status")
                        .with(user("manager1").roles("FLEET_MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dispatchable").value(true))
                .andExpect(jsonPath("$.blockingReportIds").isEmpty());

        mockMvc.perform(post("/api/inspection-reports/" + reportId + "/complete-repair")
                        .with(user("mechanic1").roles("MECHANIC")))
                .andExpect(status().isConflict());
    }
}

package com.fleetcheck.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void unauthenticatedRequest_isRejected() throws Exception {
        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void driverRole_cannotCreateVehicle() throws Exception {
        mockMvc.perform(post("/api/vehicles")
                        .with(user("driver1").roles("DRIVER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"unitNumber":"BLOCKED-001","vehicleType":"STEP_VAN","make":"Freightliner","active":true}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void fleetManagerRole_canCreateVehicle() throws Exception {
        mockMvc.perform(post("/api/vehicles")
                        .with(user("manager1").roles("FLEET_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"unitNumber":"ALLOWED-001","vehicleType":"BOX_TRUCK","make":"Freightliner","active":true}
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void mechanicRole_cannotFileInspectionReport() throws Exception {
        mockMvc.perform(post("/api/inspection-reports")
                        .with(user("mechanic1").roles("MECHANIC"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":1,"driverId":1,"inspectionDate":"2026-07-19",
                                 "odometerReading":100,"conditionSatisfactory":true,"requiresRepair":false}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void anyAuthenticatedRole_canReadVehicles() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                        .with(user("driver1").roles("DRIVER")))
                .andExpect(status().isOk());
    }

    @Test
    void driverRole_cannotViewInspectionReportsLog() throws Exception {
        mockMvc.perform(get("/api/inspection-reports")
                        .with(user("driver1").roles("DRIVER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void mechanicRole_canViewInspectionReportsLog() throws Exception {
        mockMvc.perform(get("/api/inspection-reports")
                        .with(user("mechanic1").roles("MECHANIC")))
                .andExpect(status().isOk());
    }

    @Test
    void fleetManagerRole_canViewInspectionReportsLog() throws Exception {
        mockMvc.perform(get("/api/inspection-reports")
                        .with(user("manager1").roles("FLEET_MANAGER")))
                .andExpect(status().isOk());
    }

    @Test
    void adminRole_canViewInspectionReportsLog() throws Exception {
        mockMvc.perform(get("/api/inspection-reports")
                        .with(user("admin1").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void nonAdminRole_cannotCreateAccount() throws Exception {
        mockMvc.perform(post("/api/accounts")
                        .with(user("manager1").roles("FLEET_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"blockeduser","password":"secret123","role":"MECHANIC","active":true}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRole_canCreateAccount() throws Exception {
        mockMvc.perform(post("/api/accounts")
                        .with(user("admin1").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"newmechanic","password":"secret123","role":"MECHANIC","active":true}
                                """))
                .andExpect(status().isCreated());
    }
}

package com.fleetcheck.exception;

import com.fleetcheck.domain.enums.ReportStatus;

public class InvalidStatusTransitionException extends RuntimeException {
    public InvalidStatusTransitionException(ReportStatus current, ReportStatus attempted) {
        super("Cannot transition inspection report from " + current + " to " + attempted + ".");
    }
}

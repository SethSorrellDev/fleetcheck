export type RepairType = 'SAFETY' | 'NON_SAFETY' | 'BOTH'
export type ReportStatus = 'SATISFACTORY' | 'REPAIR_REQUESTED' | 'REPAIR_COMPLETED' | 'REVIEWED_CLOSED'
export type VehicleType = 'STEP_VAN' | 'BOX_TRUCK'
export type Role = 'DRIVER' | 'MECHANIC' | 'FLEET_MANAGER' | 'ADMIN'
export type DamageType = 'CHIP' | 'HOLE' | 'DENT' | 'BROKEN' | 'MISSING' | 'SCRATCH' | 'RUST' | 'OTHER'
export type ViewAngle = 'FRONT' | 'SIDE' | 'REAR'

export interface Vehicle {
  id: number
  unitNumber: string
  vehicleType: VehicleType
  make: string | null
  model: string | null
  year: number | null
  licensePlate: string | null
  assignedRoute: string | null
  currentOdometer: number | null
  active: boolean
}

export interface Driver {
  id: number
  firstName: string
  lastName: string
  employeeId: string
  active: boolean
}

export interface Account {
  id: number
  username: string
  role: Role
  driverId: number | null
  active: boolean
}

export interface InspectionReport {
  id: number
  vehicleId: number
  driverId: number
  inspectionDate: string
  odometerReading: number | null
  conditionSatisfactory: boolean
  requiresRepair: boolean
  repairType: RepairType | null
  repairDescription: string | null
  status: ReportStatus
  driverSignedAt: string | null
  createdAt: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface DamageMarking {
  id: number
  inspectionReportId: number
  damageType: DamageType
  viewAngle: ViewAngle
  xCoordinate: number
  yCoordinate: number
  notes: string | null
}

export interface RepairOrder {
  id: number
  inspectionReportId: number
  workPerformedDescription: string | null
  completedByName: string | null
  completedAt: string | null
  driverReviewedAt: string | null
}

export interface VehicleDispatchStatus {
  vehicleId: number
  unitNumber: string
  dispatchable: boolean
  blockingReportIds: number[]
}

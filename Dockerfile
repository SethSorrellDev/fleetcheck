# Stage 1: build the jar using an image with Maven + JDK 21 already installed
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: run it on a lean JRE-only image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/fleetcheck-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

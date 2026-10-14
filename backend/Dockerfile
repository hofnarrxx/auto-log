# Multi-stage build: compile with Maven, run on a slim JRE. All base images are multi-arch,
# so this builds natively on an ARM (aarch64) host.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy only pom.xml first so the dependency layer is cached until dependencies change.
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src ./src
# Tests need a database, so they run in CI rather than in the image build.
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:21-jre
RUN useradd --system --create-home app
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar
USER app

EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]

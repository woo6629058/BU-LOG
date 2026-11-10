# BU:LOG 운영 이미지
# jar는 GitHub Actions에서 ./gradlew bootJar로 먼저 빌드한 뒤 복사한다.
FROM eclipse-temurin:21-jre

ENV TZ=Asia/Seoul \
    JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -Duser.timezone=Asia/Seoul"

RUN groupadd --system bulog && useradd --system --gid bulog --home /app bulog
WORKDIR /app

COPY build/libs/app.jar app.jar

USER bulog
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]

FROM openjdk:8-alpine

COPY target/uberjar/front-filamentos.jar /front-filamentos/app.jar

EXPOSE 3000

CMD ["java", "-jar", "/front-filamentos/app.jar"]

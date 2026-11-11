FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY ["src/SchoolAdmission.Api/SchoolAdmission.Api.csproj", "src/SchoolAdmission.Api/"]
COPY ["src/SchoolAdmission.Application/SchoolAdmission.Application.csproj", "src/SchoolAdmission.Application/"]
COPY ["src/SchoolAdmission.Domain/SchoolAdmission.Domain.csproj", "src/SchoolAdmission.Domain/"]
COPY ["src/SchoolAdmission.Infrastructure/SchoolAdmission.Infrastructure.csproj", "src/SchoolAdmission.Infrastructure/"]

RUN dotnet restore "src/SchoolAdmission.Api/SchoolAdmission.Api.csproj"

COPY . .

RUN dotnet publish "src/SchoolAdmission.Api/SchoolAdmission.Api.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "SchoolAdmission.Api.dll"]

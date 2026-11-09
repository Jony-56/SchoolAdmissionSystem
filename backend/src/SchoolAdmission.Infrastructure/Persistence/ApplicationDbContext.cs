using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Domain.Entities;

namespace SchoolAdmission.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<SchoolClass> SchoolClasses => Set<SchoolClass>();

    public DbSet<Student> Students => Set<Student>();

    public DbSet<AdmissionHold> AdmissionHolds =>
        Set<AdmissionHold>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<SchoolClass>(entity =>
        {
            entity.ToTable("SchoolClasses", table =>
            {
                table.HasCheckConstraint(
                    "CK_SchoolClasses_TotalSeats",
                    "\"TotalSeats\" > 0");

                table.HasCheckConstraint(
                    "CK_SchoolClasses_SeatCounts",
                    "\"HeldSeats\" >= 0 AND " +
                    "\"ConfirmedSeats\" >= 0 AND " +
                    "\"HeldSeats\" + \"ConfirmedSeats\" <= \"TotalSeats\"");
            });

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Shift)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.HasIndex(x => new
            {
                x.ClassNumber,
                x.Shift
            }).IsUnique();
        });

        modelBuilder.Entity<Student>(entity =>
        {
            entity.ToTable("Students");

            entity.HasKey(x => x.BirthRegistrationNumber);

            entity.Property(x => x.BirthRegistrationNumber)
                .HasMaxLength(17)
                .IsFixedLength()
                .IsRequired();

            entity.ToTable(table =>
            {
                table.HasCheckConstraint(
                    "CK_Students_BirthRegistrationNumber",
                    "char_length(\"BirthRegistrationNumber\") = 17 " +
                    "AND \"BirthRegistrationNumber\" ~ '^[0-9]{17}$'");
            });
        });

        modelBuilder.Entity<AdmissionHold>(entity =>
        {
            entity.ToTable("AdmissionHolds");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.StudentId)
                .HasMaxLength(17)
                .IsRequired();

            entity.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.HasOne(x => x.SchoolClass)
                .WithMany(x => x.AdmissionHolds)
                .HasForeignKey(x => x.SchoolClassId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Student)
                .WithMany(x => x.AdmissionHolds)
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new
            {
                x.StudentId,
                x.SchoolClassId
            })
            .IsUnique()
            .HasFilter(
                "\"Status\" IN ('HELD', 'CONFIRMED')");
        });
    }
}
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LeadsModule } from './leads/leads.module';
import { MailModule } from './mail/mail.module';
import { PartnersModule } from './partners/partners.module';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { FollowupsModule } from './followups/followups.module';
import { ApplicationsModule } from './applications/applications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PermissionsModule } from './permissions/permissions.module';
import { OfflinePaymentsModule } from './offline-payments/offline-payments.module';
import { CountriesModule } from './countries/countries.module';
import { CoursesModule } from './courses/courses.module';
import { UniversitiesModule } from './universities/universities.module';
import { TimelineModule } from './timeline/timeline.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { StorageModule } from './storage/storage.module';
import { BranchesModule } from './branches/branches.module';
import { TodosModule } from './todos/todos.module';
import { OptionsModule } from './options/options.module';
import { AgentsModule } from './agents/agents.module';
import { CommissionsModule } from './commissions/commissions.module';
import { ChatModule } from './chat/chat.module';
import { DropdownsModule } from './dropdowns/dropdowns.module';
import { FinancialsModule } from './financials/financials.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    LeadsModule,
    PartnersModule,
    AuthModule,
    NotesModule,
    FollowupsModule,
    ApplicationsModule,
    DashboardModule,
    PermissionsModule,
    OfflinePaymentsModule,
    CountriesModule,
    CoursesModule,
    UniversitiesModule,
    TimelineModule,
    AnnouncementsModule,
    StorageModule,
    BranchesModule,
    TodosModule,
    OptionsModule,
    AgentsModule,
    CommissionsModule,
    ChatModule,
    DropdownsModule,
    FinancialsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

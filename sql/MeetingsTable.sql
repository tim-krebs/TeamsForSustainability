SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Meetings](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[OnlineMeetingID] [nvarchar](255) NOT NULL,
	[StartTime] [datetime] NOT NULL,
	[EndTime] [datetime] NOT NULL,
	[AttendeeCount] [int] NULL,
	[SavedEmission] [int] NULL,
	[City] [nvarchar](255) NULL,
	[PositionLon] [float] NULL,
	[PositionLat] [float] NULL,
	[OrganizerID] [nvarchar](255) NOT NULL,
	[CalculationStatus] [nvarchar](255) NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Meetings] ADD  CONSTRAINT [PK_NewTable-1] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
